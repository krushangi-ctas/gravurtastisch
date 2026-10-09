import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import GeneralSetting from './GeneralSetting';
import { GeneralSettingsSkeleton } from '@/components/skeletons/SettingsFormSkeleton';
import { useGeneralSetting } from '../../api/hooks/generalDetailsSetting/useGeneralSettings';
import { useGeneralSettingMutation } from '../../api/hooks/generalDetailsSetting/useUpdateGeneralSettings';

const generalSettingSchema = z.object({
  marketplace_id: z.string().optional(),
  order_status: z.string().nonempty('Order status is required'),
  fba: z.boolean().default(false),
  fbm: z.boolean().default(false),
  order_matching_rules: z.string().nonempty('Order matching rule is required'),
  autoSendRequest: z.boolean().default(false),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  second: z.number().min(0).max(59),
  day: z.number().min(0).max(31),
});

export type GeneralSettingFormType = z.infer<typeof generalSettingSchema>;

function GeneralSetAppView() {
  const { data: generalSetting, isLoading: isGeneralSettingLoading } = useGeneralSetting();
  const generalSettingMutation = useGeneralSettingMutation();

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
    resolver: zodResolver(generalSettingSchema),
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
