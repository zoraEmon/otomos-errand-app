import { FriendCodeInput } from '../molecules'

type ConnectFriendPanelProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  error?: string
}

export function ConnectFriendPanel(props: ConnectFriendPanelProps) {
  return (
    <section className="connect-friend-panel">
      <FriendCodeInput {...props} />
    </section>
  )
}
