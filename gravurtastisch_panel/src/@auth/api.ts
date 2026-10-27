import {
  sendOtpUrl,
  verifyOtpUrl,
  logoutUrl,
  registerUrl,
} from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const sendOtp = async (payload: any) => {
  const response = await fetch(`${sendOtpUrl}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data?.message || 'Failed to send OTP');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const verifyOtp = async (payload: any) => {
  const response = await fetch(`${verifyOtpUrl}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data?.message || 'Invalid OTP');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const register = async (payload) => {
  return await fetchWithAuth(`${registerUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const logout = async () => {
  try {
    await fetch(`${logoutUrl}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};


