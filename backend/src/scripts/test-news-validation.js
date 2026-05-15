import 'dotenv/config';
import fs from 'node:fs/promises';

const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8787}`;
const fixturePath = process.argv[2] || 'fixtures/tar-hunting-ruling.json';

async function main() {
  const fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
  const response = await fetch(`${backendUrl}/api/news/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fixture),
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
