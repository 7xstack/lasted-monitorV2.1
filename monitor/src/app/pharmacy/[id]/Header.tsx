import Image from 'next/image';
import styles from './page.module.css';
import { Setting } from './types';

interface HeaderProps {
  setting: Setting;
}

export default function Header({ setting }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.hospitalIcon}>
          <Image src="/images/logo/logo.png" alt="hospital" width={32} height={32} />
        </div>
        <span className={styles.hospitalName}>
          {setting.n_hospital || 'โรงพยาบาลชนบท'}
        </span>
      </div>
      <button className={styles.checkupButton}>
        {setting.department || 'ตรวจโรคทั่วไป'}
      </button>
    </header>
  );
}






