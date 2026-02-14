import { Redis } from '@upstash/redis'

const url = 'https://vast-amoeba-27718.upstash.io'
const token = 'AWxGAAIncDI2NmI4OWNmZjBlOTA0MTBlYjQ4NDc5ZjU3M2RhNGJmMHAyMjc3MTg'

console.log('Testing connection to:', url)

const redis = new Redis({
    url: url,
    token: token,
})

try {
    const pong = await redis.ping()
    console.log('✅ Connection successful! Response:', pong)
} catch (error) {
    console.error('❌ Connection failed!')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    if (error.cause) {
        console.error('Cause:', error.cause)
    }
}
