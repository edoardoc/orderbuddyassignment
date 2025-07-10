import { MdOutlineDashboard } from 'react-icons/md';
import { LuGitBranchPlus } from 'react-icons/lu';
import { BiFoodMenu } from 'react-icons/bi';
import { TiPrinter } from 'react-icons/ti';
import { qrCodeOutline } from 'ionicons/icons';
import { LaunchPadSection } from './types';

export const getLaunchPadConfig = (restaurantId: string, locationId: string): LaunchPadSection[] => [
  {
    name: 'Daily Operations',
    apps: [
      {
        name: 'Orders',
        icon: MdOutlineDashboard,
        link: `/${restaurantId}/${locationId}/apps/orders`,
        iconProps: {
          size: 32,
        },
      },
      {
        name: 'KDS',
        icon: LuGitBranchPlus,
        link: `/${restaurantId}/${locationId}/apps/kds`,
        iconProps: {
          size: 32,
        },
      },
    ],
  },
  {
    name: 'Setup and Configuration',
    apps: [
      {
        name: 'Menu',
        icon: BiFoodMenu,
        link: `/${restaurantId}/${locationId}/apps/menu/list`,
        iconProps: {
          size: 32,
        },
      },
      {
        name: 'Origins',
        icon: qrCodeOutline,
        link: `/${restaurantId}/${locationId}/apps/origins`,
        iconProps: {},
        isIonIcon: true,
      },
      {
        name: 'Stations',
        icon: LuGitBranchPlus,
        link: `/${restaurantId}/${locationId}/apps/stations`,
        iconProps: {
          size: 32,
        },
      },
      {
        name: 'Printers',
        icon: TiPrinter,
        link: `/${restaurantId}/${locationId}/apps/printers`,
        iconProps: {
          size: 32,
        },
      },
    ],
  },
];
