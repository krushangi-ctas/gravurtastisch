import {
  sendOtpUrl,
  verifyOtpUrl,
  logoutUrl,
  registerUrl,
} from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const sendOtp = async (payload: any) => {
  const currentLang =
    typeof window !== 'undefined'
      ? localStorage.getItem('panel_lng') || localStorage.getItem('i18nextLng') || 'de'
      : 'de';
  // Strip lang from body payload so deployed backend Joi schema won't fail with "'lang' is not allowed"
  // Instead, send the language in the Accept-Language header
  const { lang, ...bodyData } = payload || {};
  const response = await fetch(`${sendOtpUrl}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': currentLang,
    },
    body: JSON.stringify(bodyData),
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_access_token') : null;
    await fetch(`${logoutUrl}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.replace(/^["']+|["']+$/g, '').trim()}` } : {}),
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};


