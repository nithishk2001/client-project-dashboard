interface Props {
  value: string;
}

// Small reusable badge for task status/priority. Uses CSS classes
// like "badge-TODO", "badge-HIGH" defined in index.css.
export default function Badge({ value }: Props) {
  return <span className={`badge badge-${value}`}>{value}</span>;
}
