export default function ShinyText({ children, as: Tag = 'span', className = '' }) {
  return <Tag className={`shiny-text ${className}`}>{children}</Tag>;
}
