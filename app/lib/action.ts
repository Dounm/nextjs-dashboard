'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Form from '../ui/invoices/create-form';
import { stat } from 'fs/promises';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object(
  {
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer by id',
    }),
    amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0" }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status between pending and paid',
    }),
    date: z.string(),
  }
);

const CreateInvoices = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}

export async function createInvoices(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoices.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    }
  }
  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0]

  console.log(customerId, amount, status, date);
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error(error)
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  console.log(customerId, amount, status);

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount=${amountInCents}, status=${status}
    WHERE id=${id}
  `;
  } catch (error) {
    console.error(error)
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  console.log(`Delete invoice with id=${id}`);
  await sql`
    DELETE FROM invoices WHERE id=${id}
  `;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined, 
  formData: FormData,
  redirectTo?: string
) {
  try {
    console.log('before signIn')
    await signIn('credentials', formData);
    console.log('after signIn')
    
    // 登录成功后重定向到指定页面或默认页面
    redirect(redirectTo || '/dashboard');
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid Credentials';
        default:
          return 'Something Wrong! maybe wrong email or password'
      }
    }
    throw error; // 重新抛出未处理的错误
  }
}
