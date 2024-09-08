import { getData } from  '$lib/data.js'

export async function load({ fetch, params }) {
	return await getData(fetch)
}