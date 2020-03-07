import fb from "@/fb";
import Vue from "vue";

export default {
    namespaced: true,
    state: {
        teams: []
    },
    mutations: {
        SET_TEAMS(state, payload) {
            state.teams = payload
        },
        CREATE_TEAM(state, payload) {
            state.teams.push(payload)
        },
        UPDATE_TEAM(state, payload) {
            const team = state.teams.find(team => team.id === payload.id)
            state.teams = state.teams.filter(team => team.id !== payload.id)
            state.teams.push({ ...team, ...payload })
        },
        DELETE_TEAM(state, payload) {
            state.teams = state.teams.filter(team => team.id !== payload.teamId)
        },
        DELETE_ROUND(state, payload) {
            state.teams = state.teams.map(team => {
                const round = team.rounds[payload.roundId];
                if (round) delete team.rounds[payload.roundId];
                return { ...team }
            })
        },
        CREATE_ROUND(state, payload) {
            const team = state.teams.find((team) => team.id === payload.teamId);
            const round = {
                [payload.id]: payload
            }
            Vue.set(team, 'rounds', { ...team.rounds, ...round })
        }
    },
    actions: {
        setTeams({ commit, rootGetters }, payload) {
            const game = rootGetters['games/game'](payload)
            let data = []
            if (game.teams) {
                const teams = game.teams
                data = Object.keys(teams).map(key => {
                    return { ...teams[key], id: key }
                })
            }
            commit("SET_TEAMS", data)
        },
        createTeam({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id

            const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/geekstat-v.appspot.com/o/common%2Fteam.jpg?alt=media&token=74d21226-02b7-4ad6-aa88-220c960f82c3'
            const team = {
                ...payload,
                imageUrl,
                rounds: {},
                favorite: false
            }
            fb.database().ref('users').child(user).child('games')
                .child(payload.gameId)
                .child('teams')
                .push(team)
                .then((data) => {
                    const key = data.key;
                    commit("CREATE_TEAM", { ...team, id: key })
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })
        },
        updateTeam({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id
            // eslint-disable-next-line no-unused-vars
            const getTeam = ({ gameId, ...rest }) => rest
            fb.database().ref('users').child(user).child('games').child(payload.gameId).child('teams').child(payload.id).update(getTeam(payload))
                .then(() => {
                    commit("UPDATE_TEAM", payload)
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })
        },
        updateTeamImage({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id
            const ext = payload.ext
            let imageUrl
            const imagePath = fb.storage().ref('users').child(user).child('teams').child(`${payload.id}${ext}`)
            if (fb.storage().ref('users').child(user).child('teams').child(`${payload.teamId}${ext}`)) {
                fb.storage().ref('users').child(user).child('teams').child(`${payload.teamId}${ext}`).delete()
            }
            imagePath.put(payload.image)
                .then(() => {
                    return imagePath.getDownloadURL()
                })
                .then((url) => {
                    imageUrl = url
                    return fb.database().ref('users').child(user).child('games').child(payload.gameId).child('teams').child(payload.id).update({ imageUrl })
                })
                .then(() => {
                    commit("UPDATE_TEAM", { ...payload, ext, imageUrl })
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })
        },
        deleteTeam({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id
            if (fb.storage().ref('users').child(user).child('teams').child(`${payload.teamId}${payload.ext}`)) {
                fb.storage().ref('users').child(user).child('teams').child(`${payload.teamId}${payload.ext}`).delete()
            }
            fb.database().ref('users').child(user).child('games').child(payload.gameId).child('teams').child(payload.teamId).remove()
                .then(() => {
                    commit("DELETE_TEAM", payload)
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })

        },
        createRound({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id
            fb.database().ref('users').child(user).child('games')
                .child(payload.gameId)
                .child('teams')
                .child(payload.teamId)
                .child('rounds')
                .push(payload)
                .then((data) => {
                    const key = data.key;
                    commit("CREATE_ROUND", { ...payload, id: key })
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })
        },
        deleteRound({ commit, rootState }, payload) {
            commit('SET_LOADING', true, { root: true })
            const user = rootState.user.user.id
            fb.database().ref('users').child(user).child('games').child(payload.gameId).child('teams').child(payload.teamId).child('rounds').child(payload.roundId).remove()
                .then(() => {
                    commit("DELETE_ROUND", payload)
                    commit('SET_LOADING', false, { root: true })
                })
                .catch((e) => {
                    commit('SET_LOADING', false, { root: true })
                    console.log(e)
                })

        },
    },
    getters: {
        teams(state) {
            return state.teams
        },
        team(state) {
            return (teamId) => {
                return state.teams.find((team) => {
                    return team.id === teamId
                })
            }
        },
        rounds(state) {
            return (teamId) => {
                const team = state.teams.find((team) => team.id === teamId)
                return team.rounds ? team.rounds : null
            }
        }
    }
}