export default function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-xl font-bold">
        Request Detail #{params.id}
      </h1>
    </div>
  );
}