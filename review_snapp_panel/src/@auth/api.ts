import {
  sendOtpUrl,
  verifyOtpUrl,
  registerUrl,
} from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const sendOtp = async (payload) => {
  return await fetchWithAuth(`${sendOtpUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const verifyOtp = async (payload) => {
  return await fetchWithAuth(`${verifyOtpUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const register = async (payload) => {
  return await fetchWithAuth(`${registerUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

