import { useState } from 'react'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { login, closePinModal } from '../../store/authSlice'
import styles from './PinModal.module.scss'

export const PinModal = () => {
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState(false)
  const [shake, setShake]   = useState(false)
  const dispatch = useAppDispatch()

  const correctPin = import.meta.env.VITE_APP_PIN

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === correctPin) {
      dispatch(login())
    } else {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className={styles.overlay} onClick={() => dispatch(closePinModal())}>
      <div
        className={`${styles.modal} ${shake ? styles.shake : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.title}>Enter PIN</p>
        <p className={styles.subtitle}>Access your personal expense data</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={`${styles.pinInput} ${error ? styles.error : ''}`}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            placeholder="••••"
            autoFocus
          />
          {error && <p className={styles.errorMsg}>Incorrect PIN</p>}
          <button type="submit" className={styles.submitBtn}>
            Unlock
          </button>
        </form>

        <p className={styles.demoNote}>
          No PIN? You're in demo mode — explore freely!
        </p>
      </div>
    </div>
  )
}
