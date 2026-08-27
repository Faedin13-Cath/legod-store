import { createAdminClient } from '@/lib/supabase/admin'

/** true si el usuario tiene el flag is_admin en su perfil. */
export async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('is_admin').eq('id', userId).single()
  return !!data?.is_admin
}
