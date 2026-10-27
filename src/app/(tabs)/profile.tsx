import Constants from 'expo-constants'
import { router } from 'expo-router'
import { LogOut, Palette, Users } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'

import { ChipSelect } from '@/components/field/ChipSelect'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { Title } from '@/components/ui/Title'
import { Toast } from '@/components/ui/Toast'
import { getDb } from '@/db/database'
import { useLocalQuery } from '@/db/useLocalQuery'
import { updateDisplayName } from '@/features/auth/organizations'
import { signOut, useActiveMembership, useSession } from '@/features/auth/session'
import { mobileDataSetting, writeSetting } from '@/features/sync/network-policy'
import { pendingCount } from '@/features/sync/pending'
import { syncNow } from '@/features/sync/triggers'
import { isNetworkError, messageFor } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

const offlineEdit = 'Necesitas conexión para cambiar tu nombre.'

export default function ProfileScreen() {
  const { state } = useSession()
  const active = useActiveMembership()
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [signOutPending, setSignOutPending] = useState<number | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const userId = state.status === 'signedIn' ? state.session.user.id : null

  const edited = useRef(false)
  const mobileData =
    useLocalQuery<{ value: string }>(
      'select value from settings where key = ?',
      [mobileDataSetting],
      ['settings'],
    ).rows[0]?.value === '1'

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setNameError(isNetworkError(error) ? offlineEdit : messageFor(error))
        // A late answer never overwrites what the person is already typing.
        if (!edited.current) setDisplayName(data?.display_name ?? '')
      })
  }, [userId])

  if (state.status !== 'signedIn') return null

  const saveName = async () => {
    setSavingName(true)
    setNameError(null)
    try {
      await updateDisplayName(state.session.user.id, displayName.trim())
      setToast('Nombre guardado')
    } catch (e) {
      setNameError(isNetworkError(e) ? offlineEdit : messageFor(e))
    } finally {
      setSavingName(false)
    }
  }

  const confirmSignOut = async () => {
    setSigningOut(true)
    setSignOutError(null)
    try {
      await signOut()
    } catch (e) {
      setSignOutError(isNetworkError(e) ? 'Necesitas conexión para cerrar sesión.' : messageFor(e))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <View className="flex-1">
      <Screen>
        <Title text="Perfil" />
        <Card className="gap-3">
          <Text className="font-sans text-caption text-muted">Correo</Text>
          <Text className="font-sans-semibold text-body text-text">{state.session.user.email}</Text>
          <TextField
            label="Tu nombre"
            value={displayName}
            onChangeText={(text) => {
              edited.current = true
              setDisplayName(text)
            }}
            autoComplete="name"
            maxLength={80}
            error={nameError ?? undefined}
          />
          <Button
            variant="secondary"
            label="Guardar nombre"
            loading={savingName}
            disabled={!displayName.trim()}
            onPress={saveName}
          />
        </Card>
        <Card className="gap-3">
          <Text className="font-sans text-caption text-muted">Finca</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-display text-section text-text">
              {active?.organization_name ?? 'Sin finca'}
            </Text>
            {active ? <RoleBadge role={active.role} /> : null}
          </View>
          <Button
            variant="secondary"
            label="Cambiar de finca"
            onPress={() => router.push('/organizations')}
          />
          {active ? (
            <Button
              variant="secondary"
              icon={Users}
              label="Personas de la finca"
              onPress={() => router.push('/members')}
            />
          ) : null}
        </Card>
        <Card className="gap-3">
          <ChipSelect
            label="Subir fotos con datos móviles"
            options={{ yes: 'Sí', no: 'Solo con Wi-Fi' }}
            value={[mobileData ? 'yes' : 'no']}
            onChange={(v) =>
              void getDb().then((db) =>
                writeSetting(db, mobileDataSetting, v[0] === 'yes' ? '1' : '0'),
              )
            }
          />
          <Text className="font-sans text-caption text-muted">
            Las revisiones y notas se sincronizan con cualquier conexión; las fotos pesan más.
          </Text>
        </Card>
        <Button
          variant="danger"
          icon={LogOut}
          label="Cerrar sesión"
          onPress={async () => setSignOutPending(await pendingCount())}
        />
        <Text className="text-center font-sans text-caption text-muted">
          Versión {Constants.expoConfig?.version}
        </Text>
        {__DEV__ ? (
          <Button
            variant="secondary"
            icon={Palette}
            label="Galería de componentes"
            onPress={() => router.push('/_design')}
          />
        ) : null}
      </Screen>

      <Sheet
        visible={signOutPending !== null}
        title="Cerrar sesión"
        onClose={() => setSignOutPending(null)}
      >
        <Text className="font-sans text-body text-text">
          {signOutPending
            ? `Tienes ${signOutPending} registros sin sincronizar. Si cierras sesión se perderán.`
            : 'Se borrarán de este teléfono los datos de tu finca. Vuelven al ingresar de nuevo.'}
        </Text>
        <FormError message={signOutError} />
        {signOutPending ? (
          <Button
            label="Sincronizar primero"
            onPress={() => {
              setSignOutPending(null)
              void syncNow()
              router.navigate('/pending')
            }}
          />
        ) : (
          <Button variant="ghost" label="Cancelar" onPress={() => setSignOutPending(null)} />
        )}
        <Button
          variant="danger"
          label={signOutPending ? 'Cerrar sesión igual' : 'Cerrar sesión'}
          loading={signingOut}
          onPress={confirmSignOut}
        />
      </Sheet>
      <Toast message={toast} onHide={() => setToast(null)} />
    </View>
  )
}
