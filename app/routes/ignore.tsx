// This route handles Chrome DevTools and other system requests
// that should be silently ignored

export async function loader() {
  return new Response(null, { status: 404 });
}

export default function Ignore() {
  return null;
}
