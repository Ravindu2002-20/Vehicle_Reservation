import RequestDetailPage from "../requestDetail";

export default function Page({ params }: { params: { id: string } }) {
  return <RequestDetailPage id={params.id} />;
}


