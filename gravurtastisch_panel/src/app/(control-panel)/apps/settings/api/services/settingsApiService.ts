import { api } from '@/utils/api';
import type {
  SettingsSecurity,
  UpdateUserData,
  UpdatePasswordData,
} from '../types';
import {
  generalSettingUrl,
  marketPlaceUrl,
  updatePasswordUrl,
  updateProfileUrl,
  upoadImageUrl,
} from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const settingsApiService = {
  getGeneralSettings: async (): Promise<any> => {
    const res = await fetchWithAuth(`${generalSettingUrl}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.data;
  },

  getMarketplace: async (): Promise<any> => {
    const res = await fetchWithAuth(`${marketPlaceUrl}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.data;
  },

  updateGeneralSettings: async (data: any): Promise<any> => {

    const res = await fetchWithAuth(`${generalSettingUrl}/update-setting`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Surface backend validation/business errors (e.g. once-per-month limit, max-marketplaces)
    if (res && (res.status === false || res.error)) {
      const err: any = new Error(
        res.message || 'Failed to update general settings'
      );
      err.response = res;
      throw err;
    }

    return res;

  },

  getUser: async (): Promise<any> => {
    const response = await fetchWithAuth(`${upoadImageUrl}`, {
      method: 'GET',
    });
    return response;
  },

  updateUser: async (data: UpdateUserData): Promise<any> => {

    const response = await fetchWithAuth(`${updateProfileUrl}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Check if the response indicates an error
    if (response && response.error) {
      throw new Error(response.message || 'Failed to update user profile');
    }

    return response;

  },

  updatePassword: async (data: UpdatePasswordData): Promise<any> => {
    try {
      const response = await fetchWithAuth(`${updatePasswordUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Check if the response indicates an error
      if (response && response.error) {
        throw new Error(response.message || 'Failed to update password');
      }

      return response;
    } catch (error) {
      console.error('Password update error:', error);
      // Re-throw the error so the mutation can handle it
      throw error;
    }
  },

  getSecuritySettings: () =>
    api.get(`mock/app-security-settings/0`).json<SettingsSecurity>(),

  updateSecuritySettings: (data: SettingsSecurity) =>
    api.put(`mock/app-security-settings/0`, { json: data }).json(),
};
