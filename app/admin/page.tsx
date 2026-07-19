import Link from "next/link";

const submissions = [
  { title: "Northbound", artist: "Mira K", regions: "CA, UK", status: "Pending" },
  { title: "Dil Da Route", artist: "Jassa Blue", regions: "CA, IN", status: "Pending" },
  { title: "Coastline", artist: "Mar Azul", regions: "Global", status: "Review" }
];

export default function AdminPage() {
  return <main className="admin-page"><div className="admin-wrap glass"><Link className="back-link" href="/">← Back to GlobalBeat</Link><h1>Approval studio</h1><p>This production-ready screen should be protected by the admin role in Supabase. The rows below are safe demo data until your database is connected.</p><div className="admin-table">{submissions.map((item)=><div className="admin-row" key={item.title}><strong>{item.title}<small style={{display:"block",color:"#888",marginTop:4}}>{item.artist}</small></strong><span>{item.regions}</span><span className="status">{item.status}</span><button>Review</button></div>)}</div></div></main>;
}
