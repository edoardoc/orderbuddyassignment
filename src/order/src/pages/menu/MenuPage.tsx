import React, { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonPage,
  IonRow,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { appStore } from '../../../store';

import { Link } from 'react-router-dom';
import { chevronForward } from 'ionicons/icons';
import './menu.css';
import { getUserLang, t } from '@/utils/localization';
import { useMenu } from '@/queries/useMenu';
import { useEntryInfo } from '@/queries/useEntryInfo';
import Banner from './components/banner/Banner';
import Categories from './components/categories/categories';
import MenuItemModal from './components/menuItemModal/MenuItemModal';
import MenuItem from './MenuItem';
import { useOrderStore } from '@/stores/orderStore';

type MenuParams = {
  restaurantId: string;
  locationId: string;
  menuId: string;
};

type LocalizedString = {
  en: string;
  es?: string;
  pt?: string;
};

type Variant = {
  id: string;
  name: string;
  priceCents: number;
  default?: boolean;
};

type ModifierOption = {
  id: string;
  name: LocalizedString;
  priceCents: number;
};

type Modifier = {
  id: string;
  name: LocalizedString;
  type: 'standard' | 'upsell';
  required: boolean;
  selectionMode: 'single' | 'max' | 'multiple';
  maxChoices: number;
  freeChoices: number;
  extraChoicePriceCents: number;
  options: ModifierOption[];
};
interface MenuItemStructure {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  imageUrls?: string[] | null;
  categoryId: string;
  priceCents: number;
  makingCostCents: number;
  isAvailable?: boolean | null;
  stationTags?: string[] | null;
  variants?: Variant[] | null;
  modifiers?: Modifier[] | null;
}

const MenuPage: React.FC = () => {
  const { restaurantId, locationId, menuId } = useParams<MenuParams>();
  const searchParams = new URLSearchParams(window.location.search);
  let originId = searchParams.get('originId');
  if (!originId) {
    originId = 'web';
  }

  const setRestaurant = useOrderStore((s) => s.setRestaurant);
  const setMenuId = useOrderStore((s) => s.setMenuId);
  const setSalesTax = useOrderStore((s) => s.setSalesTax);

  const appState = appStore();

  const { data: entryInfo } = useEntryInfo(restaurantId, locationId, originId);
  const { data: menuData, isLoading, isError } = useMenu(restaurantId, locationId, menuId);
  const currentLang = getUserLang();

  const [selectedItem, setSelectedItem] = useState<MenuItemStructure | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  //reset session if coming back after a long time
  // const validateSession = useOrderStore((s) => s.validateSession);
  // useEffect(() => {
  //   const isValid = validateSession();
  //   if (!isValid) {
  //     const newUrl = new URL(window.location.href);
  //     newUrl.searchParams.set('originId', 'web');
  //     window.history.replaceState({}, '', newUrl.toString());
  //   }
  // }, [validateSession]);

  useEffect(() => {
    if (menuData) {
      setSalesTax(menuData.salesTax);
      setMenuId(menuData._id);
    }
  }, [menuData]);

  useEffect(() => {
    if (entryInfo) {
      setRestaurant(entryInfo);
    }
  }, [entryInfo]);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Add useEffect for scroll detection
  useEffect(() => {
    if (!menuData?.categories) return;

    const options = {
      root: document.querySelector('ion-content'),
      rootMargin: '-40px 0px 0px 0px', // Adjust based on your header height
      threshold: 0.2,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.id.replace('category-', '');
          setSelectedCategory(categoryId);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    // Observe all category sections
    menuData.categories.forEach((category) => {
      const element = document.getElementById(`category-${category.id}`);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [menuData?.categories]);

  useEffect(() => {
    if (menuData?.categories && menuData.categories.length > 0) {
      setSelectedCategory(menuData.categories[0].id);

      // Optional: Scroll to first category
      const element = document.getElementById(`category-${menuData.categories[0].id}`);
      if (element) {
        const ionContent = document.querySelector('ion-content');
        if (ionContent) {
          const headerHeight = 64;
          const elementTop = element.offsetTop - headerHeight;
          ionContent.scrollToPoint(0, elementTop, 500);
        }
      }
    }
  }, [menuData?.categories]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const ionContent = document.querySelector('ion-content');
      if (ionContent) {
        const headerHeight = 64; // Reduced from 80px
        const elementTop = element.offsetTop - headerHeight;
        ionContent.scrollToPoint(0, elementTop, 500);
      }
    }
  };

  const handleItemClick = (item: MenuItemStructure) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonGrid class='navbar-violet'>
          <Banner
            restaurantName={entryInfo?.restaurant.name!}
            restaurantLogo={entryInfo?.restaurant.logo}
            origin={entryInfo?.origin.label!}
            restaurantId={entryInfo?.restaurant._id!}
          />
        </IonGrid>
      </IonHeader>

      <IonContent class='hidescrollall'>
        <div className='menu-container'>
          {menuData && (
            <Categories
              categories={menuData.categories}
              onSelectCategory={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          )}

          <div className='menu-sections-container'>
            {menuData?.categories.map((category) => (
              <div key={category.id} className='category-section' id={`category-${category.id}`}>
                <div className='category-header'>
                  <h2 className='category-title'>
                    {category.emoji}
                    {t(category.name, currentLang)}
                  </h2>
                  <p className='category-description'>{t(category.description, currentLang)}</p>
                </div>

                <div className='menu-items-grid'>
                  {menuData.items
                    .filter((item) => item.categoryId === category.id)
                    .map((item) => (
                      <MenuItem key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>

      <MenuItemModal selectedItem={selectedItem} onClose={closeModal} isOpen={isModalOpen} />

      {appState.order.items.length > 0 && (
        <IonFooter className='ion-no-border'>
          <IonToolbar>
            {appState.order.items?.length > 0 && (
              <Link to={`/cart/${restaurantId}/${locationId}/${menuId}?originId=${originId}`}>
                <IonButton
                  expand='block'
                  className='violet-background ion-no-padding menufooterbutton'
                  style={{ paddingLeft: '10px', paddingRight: '10px' }}
                >
                  <IonGrid className='ion-padding-start ion-padding-end'>
                    <IonRow class='ion-align-items-center'>
                      <IonCol size='10' className='ion-text-start'>
                        <IonText color={'light'} style={{ fontWeight: '700' }}>
                          {appState.order.items.length} item(s) added
                        </IonText>
                      </IonCol>
                      <IonCol size='2' className='ion-align-items-center ion-text-center'>
                        <IonText
                          color={'light'}
                          style={{
                            fontWeight: '600',
                            fontSize: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          Cart
                          <IonIcon
                            icon={chevronForward}
                            style={{
                              fontSize: '20px',
                              fontWeight: '510px',
                              marginLeft: '4px',
                              height: '19px',
                            }}
                          />
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonButton>
              </Link>
            )}
          </IonToolbar>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default MenuPage;
