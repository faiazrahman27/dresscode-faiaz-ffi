import { useParams } from 'react-router-dom'

export default function HtmlViewer() {
  const { code } = useParams()
  return <div className="p-8">Full screen HTML view for: {code}</div>
}