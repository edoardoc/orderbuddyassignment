import React from 'react';
import { IonRow, IonCol, IonText } from '@ionic/react';
import { getUserLang, t } from '@/utils/localization';
import './categories.css';

interface Category {
  id: string;
  name: {
    en: string;
    es: string;
    pt: string;
  };
  description: {
    en: string;
    es: string;
    pt: string;
  };
  emoji?: string;
}

interface CategoriesProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  const currentLang = getUserLang();

  return (
    <div className='sticky-categories'>
      {/* <div style={{ marginTop: '10px' }}> */}
      <div className='categories-container'>
        <IonRow className='categories-row'>
          {categories.map((category) => (
            <IonCol
              key={category.id}
              size='auto'
              className={`category-item ${selectedCategory === category.id ? 'selected' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <IonText color='dark'>
                {category.emoji}
                {t(category.name, currentLang)}
              </IonText>
            </IonCol>
          ))}
        </IonRow>
      </div>
    </div>
  );
};

export default Categories;
