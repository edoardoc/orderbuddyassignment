import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { IoDownloadOutline } from 'react-icons/io5';
import { BsQrCodeScan } from 'react-icons/bs';

import {
  IonCard,
  IonInput,
  IonButton,
  IonCardHeader,
  IonGrid,
  IonRow,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonToolbar,
  IonPage,
  IonIcon,
  IonSpinner,
  IonCardSubtitle,
  IonCardTitle,
  IonFab,
  IonCol,
  IonPopover,
  IonText,
  IonFabButton,
  IonList,
  IonItem,
  IonProgressBar,
  IonCardContent,
} from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import { add, qrCodeOutline } from 'ionicons/icons';
import ColorPicker from 'react-pick-color';
import QRCodeStyling, {
  Options,
  DrawType,
  TypeNumber,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType,
} from 'qr-code-styling';
import { Origin, useOrigins } from '../../queries/origin/useOrigin';
import { useUpdateQrStyle } from '../../queries/origin/useQrcode';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import AddOriginModal from './components/AddOriginPage';
import { useLogoUpload } from '../../queries/origin/useLogo';
import { azureConfig } from '../../queries/manage-menu/useStorage';
import { appStore } from '../../store';
import { display } from 'html2canvas/dist/types/css/property-descriptors/display';
interface station {
  _id: string;
  stations: stationItem[];
  qrCodeImage: string;
  qrCodeStyle: any;
}

interface stationItem {
  id: string;
  name: string;
  qrCode: string;
  qrcodeImage: string;
  url: string;
}
const schema = z.object({
  stationName: z.string().min(1),
});
type FormFields = z.infer<typeof schema>;

const OriginsPage: React.FC = () => {
  const styleModal = useRef<HTMLIonModalElement>(null);
  const { restaurantId, locationId } = useParams<{ restaurantId: string; locationId: string }>();
  const { data: origins, isLoading } = useOrigins(restaurantId, locationId);
  const updateQrStyle = useUpdateQrStyle(restaurantId, locationId);
  const smartScanUrl = import.meta.env.VITE_SMART_SCAN_URL;
  // const appState = appStore()
  const [colors, setColor] = useState('#fff');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const restaurantLogo =
    appStore((state) => state.selection.restaurant.logo) || 'https://order.orderbuddyapp.com/logo.png';
  const { setRestaurantLogo } = appStore();

  const [options, setOptions] = useState<Options>({
    width: 200,
    height: 200,
    type: 'svg' as DrawType,
    data: 'https://order.orderbuddyapp.com/',
    margin: 10,
    qrOptions: {
      typeNumber: 0 as TypeNumber,
      errorCorrectionLevel: 'H' as ErrorCorrectionLevel,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.6,
      margin: 1,
      crossOrigin: 'anonymous',
    },
    image: restaurantLogo,

    dotsOptions: {
      color: '#36454F',

      type: 'dots' as DotType,
    },
    backgroundOptions: {
      color: colors,
    },
    cornersSquareOptions: {
      color: '#222222',
      type: 'extra-rounded' as CornerSquareType,
    },
    cornersDotOptions: {
      color: '#222222',
      type: 'dot' as CornerDotType,
    },
    shape: 'square',
  });
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling(options));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const logoUpload = useLogoUpload(restaurantId, locationId);
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const file = files[0];

    if (file.size > azureConfig.maxFileSize) {
      return;
    }

    if (!azureConfig.allowedFileTypes.includes(file.type)) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const logoUrl = await logoUpload.mutateAsync(file);
      setOptions((prev) => ({
        ...prev,
        image: logoUrl as string,
      }));
      setRestaurantLogo(logoUrl as string);
    } catch (error) {
      console.error('Logo upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  }, [qrCode, ref]);

  useEffect(() => {
    if (!qrCode) return;
    qrCode.update(options);
  }, [qrCode, options]);

  const {
    formState: { errors },
    reset,
  } = useForm<FormFields>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  });

  const onDataOuterEdgeColorChange = (color: any) => {
    setOptions((options) => ({
      ...options,
      cornersSquareOptions: {
        color: color,
        type: 'extra-rounded' as CornerSquareType,
      },
    }));
  };
  const onDataInnerEdgeColorChange = (color: any) => {
    setOptions((options) => ({
      ...options,
      cornersDotOptions: {
        color: color,
        type: 'dot' as CornerDotType,
      },
    }));
  };

  const generateQrCode = async (origin: Origin) => {
    const config = { ...origin.qrCodeStyle, data: `${smartScanUrl}/${origin.qrCodeId}` };
    const qrCode = new QRCodeStyling({
      ...config,
      type: 'canvas',
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    await qrCode.append(container);

    setTimeout(() => {
      qrCode.download({ extension: 'png', name: origin.label });
      container.remove();
    }, 500);
  };

  const handleStyleUpdate = async () => {
    if (!ref.current) return;
    try {
      await updateQrStyle.mutateAsync({
        options,
        ref: { current: ref.current },
      });
      styleModal.current?.dismiss();
    } catch (error) {
      console.error('Failed to update QR style:', error);
    }
  };

  return (
    <IonPage className='body'>
      <LaunchPadNavBar title='Origins' />
      <IonContent>
        <IonGrid>
          <IonRow className=' ion-align-items-center'>
            <IonCol size='12' className='ion-text-end'>
              <IonButton id='qrcode-style' fill='outline'>
                <IonIcon icon={qrCodeOutline} />
                <IonText className='ion-padding-start'> Style Manager</IonText>
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            {isLoading && (
              <div>
                <IonSpinner></IonSpinner>
              </div>
            )}

            {!isLoading &&
              origins?.map((origin, index) => (
                <IonCol size-sm='6' size-md='3' key={index}>
                  <IonCard
                    key={origin._id}
                    className='ion-padding-bottom '
                    style={{ backgroundColor: 'white', width: '220px' }}
                  >
                    <IonCardHeader className='ion-no-padding ion-padding-start ion-padding-top'>
                      <IonCardTitle className='ion-text-start'>
                        <IonText style={{ fontSize: '14px' }}>{origin.label}</IonText>
                      </IonCardTitle>
                      <IonCardSubtitle className='ion-text-start'>
                        <IonText>{origin.type}</IonText>
                      </IonCardSubtitle>
                    </IonCardHeader>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <img src={origin.qrCodeImage} alt={origin.label}></img>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className='tooltip'>
                        <Link
                          to='#'
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`${smartScanUrl}/${origin.qrCodeId}`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <IonButton aria-label='Scan QR' size='small' fill='outline'>
                            <BsQrCodeScan size={15} style={{ color: 'white' }} />
                            <IonText style={{ textTransform: 'Capitalize', paddingLeft: '5px' }}>Scan</IonText>
                          </IonButton>
                        </Link>
                      </div>

                      <div className='tooltipdown'>
                        <IonButton
                          fill='outline'
                          size='small'
                          aria-label='Download QR'
                          type='button'
                          onClick={() => generateQrCode(origin)}
                        >
                          <IoDownloadOutline style={{ color: 'white' }} />
                          <IonText style={{ textTransform: 'Capitalize', paddingLeft: '5px' }}>download</IonText>
                        </IonButton>
                      </div>
                    </div>
                  </IonCard>
                </IonCol>
              ))}
          </IonRow>
        </IonGrid>

        <IonFab slot='fixed' vertical='bottom' horizontal='end'>
          <IonFabButton onClick={() => setIsAddModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
          <AddOriginModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </IonFab>
        <IonModal
          ref={styleModal}
          trigger='qrcode-style'
          className='modal-fullscreen'
          onDidPresent={() => {
            if (ref.current) {
              qrCode.append(ref.current);
            }
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot='start'>
                <IonButton onClick={() => styleModal.current?.dismiss()}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className='ion-padding'>
            <IonGrid>
              <IonRow>
                <IonCol size='6' className='ion-text-start'>
                  <IonGrid>
                    <IonRow>Eye color</IonRow>
                    <IonRow>
                      <IonCol size='6'>
                        <IonButton
                          id='outer-ring'
                          style={{ backgroundColor: options.cornersSquareOptions?.color }}
                          size='default'
                          color='default'
                        ></IonButton>
                        <IonInput
                          value={options.cornersSquareOptions?.color}
                          onIonChange={(e) => onDataOuterEdgeColorChange(e.detail.value!)}
                          fill='solid'
                        ></IonInput>
                        <IonPopover trigger='outer-ring' triggerAction='click'>
                          <IonContent style={{ height: '300px' }}>
                            <ColorPicker color={colors} onChange={(color) => onDataOuterEdgeColorChange(color.hex)} />
                          </IonContent>
                        </IonPopover>
                      </IonCol>
                      <IonCol size='6'>
                        {' '}
                        <IonButton
                          id='inner-ring'
                          style={{ backgroundColor: options.cornersDotOptions?.color }}
                          size='default'
                          color='default'
                        ></IonButton>
                        <IonInput
                          value={options.cornersDotOptions?.color}
                          onIonChange={(e) => onDataInnerEdgeColorChange(e.detail.value!)}
                          fill='solid'
                        ></IonInput>
                        <IonPopover trigger='inner-ring' triggerAction='click'>
                          <IonContent style={{ height: '300px' }}>
                            <ColorPicker color={colors} onChange={(color) => onDataInnerEdgeColorChange(color.hex)} />
                          </IonContent>
                        </IonPopover>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size='12'>
                        <IonList>
                          <IonItem lines='none'>
                            <input
                              type='file'
                              accept={azureConfig.allowedFileTypes.join(',')}
                              onChange={handleLogoUpload}
                              style={{ display: 'none' }}
                              id='logo-upload'
                            />
                            <IonButton
                              expand='block'
                              fill='outline'
                              slot='end'
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              disabled={uploading}
                            >
                              {uploading ? 'Uploading...' : 'Upload Logo'}
                            </IonButton>
                          </IonItem>
                          {uploading && <IonProgressBar value={uploadProgress}></IonProgressBar>}
                        </IonList>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCol>
                <IonCol
                  className='white-background'
                  style={{
                    height: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'start',
                    paddingTop: '40px',
                  }}
                  size='6'
                >
                  <div style={{ fontSize: '14px', textAlign: 'center', color: '#424242' }}>
                    Preview
                    <IonCard className='rounded'>
                      <div ref={ref} />
                    </IonCard>
                    <IonButton
                      onClick={handleStyleUpdate}
                      fill='solid'
                      className='solid-button'
                      style={{ display: 'block', marginTop: '20px' }}
                    >
                      Save
                    </IonButton>
                  </div>
                </IonCol>{' '}
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};
export default OriginsPage;
