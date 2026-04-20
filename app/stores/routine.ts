import { defineStore } from 'pinia'
import type { RoutineStatus, RoutineData } from '~/types/routine'

export const useRoutineStore = defineStore(
	'routine',
	() => {
		const map = reactive(new Map<string, RoutineData>())

		const getStatus = (routineId: string, index: number) => {
			if (map.has(routineId)) {
				const { status } = map.get(routineId)!
				return status[index] ?? 'todo'
			} else {
				return 'todo'
			}
		}

		const setStatus = (
			routineId: string,
			index: number,
			value: RoutineStatus,
		) => {
			let routine = map.get(routineId)
			if (!routine) {
				routine = { status: [], resetAt: Date.now() }
				map.set(routineId, routine)
			}
			if (routine.status.length <= index) {
				routine.status.push(
					...Array(index + 1 - routine.status.length).fill('todo'),
				)
			}
			routine.status[index] = value
		}

		const reset = (id: string) => {
			map.delete(id)
		}

		const getResetAt = (id: string) => {
			return map.get(id)?.resetAt ?? Date.now()
		}

		const getNextIndex = (
			routineId: string,
			currentIndex: number,
			max: number,
		) => {
			const routine = map.get(routineId)
			if (!routine) {
				return -1
			}
			const nextIndex = routine.status.findIndex(
				(value, index) => index > currentIndex && value !== 'disabled',
			)
			if (nextIndex >= 0) {
				return nextIndex
			}
			if (routine.status.length < max) {
				return routine.status.length
			}
			return -1
		}

		return { getStatus, setStatus, reset, getResetAt, getNextIndex }
	},
	{
		persist: true,
	},
)
