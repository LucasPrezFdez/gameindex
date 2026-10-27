import { NextResponse } from "next/server";
import { createServiceDatabaseClient, createSqlClient } from "@/services/database";
import { ensureProfile, getUserFromRequest } from "@/services/community";
import { createNotification } from "@/services/notifications";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Reseña no válida." }, { status: 400 });

  const auth = await getUserFromRequest(request);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

  const serviceClient = createServiceDatabaseClient();

  const { data: review, error: reviewError } = await serviceClient
    .from("reviews")
    .select("user_id, game_id, hidden_at")
    .eq("id", id)
    .maybeSingle();
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });
  if (!review || review.hidden_at) return NextResponse.json({ error: "Reseña no encontrada." }, { status: 404 });
  if (review.user_id === auth.user.id) {
    return NextResponse.json({ error: "No puedes votar tu propia reseña." }, { status: 400 });
  }

  await ensureProfile(serviceClient, auth.user);

  const { data: existingVote } = await serviceClient
    .from("review_helpful_votes")
    .select("review_id")
    .eq("review_id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { error: voteError } = await serviceClient
    .from("review_helpful_votes")
    .upsert({ review_id: id, user_id: auth.user.id }, { onConflict: "review_id,user_id" });

  if (voteError) return NextResponse.json({ error: voteError.message }, { status: 500 });

  // Recuento atómico en una sola sentencia: evita guardar un valor desfasado si llegan votos a la vez.
  const sql = createSqlClient();
  const rows = (await sql.query(
    `update reviews
        set helpful_count = (select count(*)::int from review_helpful_votes where review_id = $1)
      where id = $1
      returning helpful_count`,
    [id]
  )) as Array<{ helpful_count: number }>;
  const helpfulCount = Number(rows[0]?.helpful_count ?? 0);

  if (!existingVote && review.user_id) {
    await createNotification({
      recipientId: review.user_id,
      actorId: auth.user.id,
      type: "review_helpful",
      reviewId: id,
      gameId: review.game_id ?? null
    });
  }

  return NextResponse.json({ ok: true, helpfulCount });
}
