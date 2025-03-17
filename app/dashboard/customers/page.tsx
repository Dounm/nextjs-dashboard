export default async function Page() {
  const seconds = 3;
  console.log('Fetching customers data...');
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  return <p>Customers page</p>
}

