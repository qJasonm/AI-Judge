import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const getActiveSubscriptions = () => axios.get(`${API_BASE}/subscriptions`).then(res => res.data);
export const cancelSubscription = (id) => axios.post(`${API_BASE}/subscriptions/${id}/cancel`).then(res => res.data);
export const keepSubscription = (id) => axios.post(`${API_BASE}/subscriptions/${id}/keep`).then(res => res.data);
export const getOverview = () => axios.get(`${API_BASE}/overview`).then(res => res.data);
