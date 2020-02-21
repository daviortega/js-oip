import { ECPair } from 'bitcoinjs-lib'
import { floTestnet } from '../../../../src/config'
import { isValidWIF } from '../../../../src/util/btc'
import { ExplorerWallet } from '../../../../src/modules/wallets'

const network = floTestnet.network

if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
  if (typeof localStorage === 'undefined') { // eslint-disable-line
    // var is needed her for the javascript hoisting effect or else localstorage won't be scoped
    var LocalStorage = require('node-localstorage').LocalStorage
    var localStorage = new LocalStorage('./localStorage')
  }
} else {
  localStorage = window.localStorage
}

const wif = 'cRVa9rNx5N1YKBw8PhavegJPFCiYCfC4n8cYmdc3X1Y6TyFZGG4B'
const myECPair = ECPair.fromWIF(wif, network)

describe(`ExplorerWallet`, () => {
  describe('Initialization', () => {
    it(`Should construct successfully with valid WIF`, () => {
      let wallet = new ExplorerWallet({ wif, network: 'testnet' })
      expect(wallet).toBeInstanceOf(ExplorerWallet)
    })
    it(`Should construct unsuccessfully with an invalid WIF`, () => {
      let wallet = new ExplorerWallet({ wif, network: 'mainnet' })
      expect(wallet.success).toBeFalsy()
    })
  })
  describe('ECPair', () => {
    it('ECPair from WIF', () => {
      expect(isValidWIF(wif, network)).toBeTruthy()
      expect(myECPair.publicKey).toBeDefined()
      expect(myECPair.privateKey).toBeDefined()
      // console.log(typeof myECPair, myECPair.network)
    })
  })
  describe('Transaction Builder', () => {
    it('create manual utxos', () => {
      let wallet = new ExplorerWallet({ wif, network: 'testnet' })
      let utxos = wallet.createManualUtxos()
      expect(Array.isArray(utxos)).toBeTruthy()
      // console.log(utxos)
    })
  })
  describe('Local Storage', () => {
    it(`serialize and delete tx history `, () => {
      let wallet = new ExplorerWallet({ wif, network: 'testnet' })
      // wallet.deleteHistory()
      wallet.addSpentTransaction('0')
      wallet.addSpentTransaction('1')
      wallet.serialize()
      expect(localStorage).toBeDefined()
      expect(localStorage.getItem('tx_history')).toBeDefined()
      let ls = localStorage.getItem('tx_history')
      ls = JSON.parse(ls)
      expect(ls.spentTransactions).toBeDefined()
      expect(ls.history).toBeDefined()
      expect(Array.isArray(ls.spentTransactions)).toBeTruthy()
      expect(Array.isArray(ls.history)).toBeTruthy()
      expect(ls.spentTransactions[ls.spentTransactions.length - 2]).toEqual('0')
      expect(ls.spentTransactions[ls.spentTransactions.length - 1]).toEqual('1')
      let pop1 = wallet.spentTransactions.pop()
      expect(pop1).toEqual('1')
      let pop0 = wallet.spentTransactions.pop()
      expect(pop0).toEqual('0')
      wallet.serialize()
    })
    it('deserialize', () => {
      let wallet = new ExplorerWallet({ wif, network: 'testnet' })
      // wallet.deleteHistory()
      wallet.addSpentTransaction('0')
      wallet.addSpentTransaction('1')
      wallet.serialize()
      let wallet2 = new ExplorerWallet({ wif, network: 'testnet' })
      let spents = wallet2.getSpentTransactions()
      expect(spents[spents.length - 2]).toEqual('0')
      expect(spents[spents.length - 1]).toEqual('1')
      let one = wallet2.spentTransactions.pop()
      expect(one).toEqual('1')
      let zero = wallet2.spentTransactions.pop()
      expect(zero).toEqual('0')
      wallet2.serialize()
    })
    it('save and get history', () => {
      let wallet = new ExplorerWallet({ wif, network: 'testnet' })
      wallet.save('tx', 'hex')
      let serialized = localStorage.getItem('tx_history')
      expect(serialized).toBeDefined()
      let serializedParsed = JSON.parse(serialized)
      expect(serializedParsed.history[serializedParsed.history.length - 1]).toEqual({ 'tx': 'hex' })
      expect(wallet.history[wallet.history.length - 1]).toEqual({ 'tx': 'hex' })
      let pop = wallet.history.pop()
      expect(pop).toEqual({ 'tx': 'hex' })
      wallet.serialize()
    })
  })
})
