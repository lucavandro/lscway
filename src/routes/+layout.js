import { getData } from  '$lib/data.js'

export async function load() {
	return await getData()
}