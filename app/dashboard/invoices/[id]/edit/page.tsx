import { customers } from "@/app/lib/placeholder-data";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import Form from '@/app/ui/invoices/edit-form';
import { fetchInvoiceById, fetchCustomers } from "@/app/lib/data";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params;
  const id = params.id;
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ])

  if (!invoice) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={
          [
            { label: 'invoices', href: '/dashboard/invoices' },
            {
              label: 'Edit invoices',
              href: `/dashboard/invoices/${id}/edit`,
              active: true,
            }
          ]
        } />
      <Form invoice={invoice} customers={customers} />
    </main>
  )
}
