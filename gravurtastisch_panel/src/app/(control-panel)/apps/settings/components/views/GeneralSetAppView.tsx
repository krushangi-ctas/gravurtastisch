import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import GeneralSetting from './GeneralSetting';
import { GeneralSettingsSkeleton } from '@/components/skeletons/SettingsFormSkeleton';
import { useGeneralSetting } from '../../api/hooks/generalDetailsSetting/useGeneralSettings';
import { useGeneralSettingMutation } from '../../api/hooks/generalDetailsSetting/useUpdateGeneralSettings';

const getGeneralSettingSchema = (t: any) =>
  z.object({
    marketplace_id: z.string().optional(),
    order_status: z.string().nonempty(t('validation.orderStatusRequired', 'Order status is required!')),
    fba: z.boolean().default(false),
    fbm: z.boolean().default(false),
    order_matching_rules: z.string().nonempty(t('validation.orderMatchingRulesRequired', 'Order matching rule is required!')),
    autoSendRequest: z.boolean().default(false),
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
    second: z.number().min(0).max(59),
    day: z.number().min(0).max(31),
  });

export type GeneralSettingFormType = {
  marketplace_id?: string;
  order_status: string;
  fba: boolean;
  fbm: boolean;
  order_matching_rules: string;
  autoSendRequest: boolean;
  hour: number;
  minute: number;
  second: number;
  day: number;
};

function GeneralSetAppView() {
  const { t } = useTranslation();
  const { data: generalSetting, isLoading: isGeneralSettingLoading } = useGeneralSetting();
  const generalSettingMutation = useGeneralSettingMutation();

  const generalSettingSchema = useMemo(() => getGeneralSettingSchema(t), [t]);

  const generalSettingMethods = useForm<GeneralSettingFormType>({
    mode: 'onChange',
    defaultValues: {
      marketplace_id: '',
      order_status: '',
      order_matching_rules: '',
      fba: false,
      fbm: false,
      autoSendRequest: false,
      hour: 0,
      minute: 0,
      second: 0,
      day: 0,
    },
    resolver: zodResolver(generalSettingSchema as any),
  });

  if (isGeneralSettingLoading) {
    return <GeneralSettingsSkeleton />;
  }

  return (
    <div>
      <FormProvider {...generalSettingMethods}>
        <GeneralSetting
          generalSettingMutation={generalSettingMutation}
          generalSetting={generalSetting}
        />
      </FormProvider>
    </div>
  );
}

export default GeneralSetAppView;
