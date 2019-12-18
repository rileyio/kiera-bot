import test from 'ava'
import * as Utils from '@/utils/react'

test('Utils:React => filter array of emoji to a defined list', t => {
  const filtered = Utils.React.filter(
    ['😄', '😏', '😬', '😭', '🙄'],
    [
      {
        users: ['1234'],
        count: 1,
        emoji: { id: null, name: '😏' }
      },
      {
        users: ['1234'],
        count: 1,
        emoji: { id: '429936443843018752', name: 'angernotification' }
      }
    ]
  )
  t.is(filtered.length, 1)
})

test('Utils:React => convert emojis to a defined int from map', t => {
  const reactsAsInts = Utils.React.toInt(
    {
      '😄': 1,
      '😏': 2,
      '😬': 3,
      '😭': 4,
      '🙄': 5
    },
    [{ users: ['1234'], count: 1, emoji: { id: null, name: '😏' } }, { users: ['1234'], count: 1, emoji: { id: null, name: '😭' } }]
  )

  t.deepEqual(reactsAsInts, [2, 4])
})
