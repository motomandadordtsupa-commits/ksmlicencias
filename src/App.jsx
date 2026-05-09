import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authorization Modal State
  const [authModal, setAuthModal] = useState({ isOpen: false, licenseId: null, clientName: '' });
  const [authType, setAuthType] = useState('unlimited'); 
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ksm_licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLicenses(data);
    } catch (error) {
      console.error("Error fetching licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const revokeLicense = async (id) => {
    if (!window.confirm("¿Seguro que deseas bloquear a este usuario?")) return;
    try {
      const { error } = await supabase
        .from('ksm_licenses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      fetchLicenses();
    } catch (error) {
      console.error("Error al revocar:", error);
    }
  };

  const deleteLicense = async (id) => {
    if (!window.confirm("⚠️ ¿Estás totalmente seguro de eliminar este registro? Se borrará de la base de datos permanentemente.")) return;
    try {
      const { error } = await supabase
        .from('ksm_licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLicenses();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el registro.");
    }
  };

  const handleAuthorizeClick = (license) => {
    setAuthType('unlimited');
    setExpirationDate('');
    setAuthModal({ isOpen: true, licenseId: license.id, clientName: license.client_name });
  };

  const confirmAuthorization = async (e) => {
    e.preventDefault();
    console.log("Iniciando autorización para ID:", authModal.licenseId);
    try {
      let expiresAt = null;
      if (authType === 'temporal' && expirationDate) {
        expiresAt = new Date(expirationDate).toISOString();
      }

      const { data, error } = await supabase
        .from('ksm_licenses')
        .update({ 
          is_active: true, 
          expires_at: expiresAt 
        })
        .eq('id', authModal.licenseId)
        .select();

      if (error) {
        console.error("Error de Supabase:", error);
        alert(`Error al autorizar: ${error.message}`);
        return;
      }

      console.log("Actualización exitosa:", data);
      setAuthModal({ isOpen: false, licenseId: null, clientName: '' });
      fetchLicenses(); 
    } catch (error) {
      console.error("Error crítico:", error);
      alert("Ocurrió un error inesperado al procesar la licencia.");
    }
  };

  const getExpirationStatus = (expiresAt) => {
    if (!expiresAt) return <span className={styles.expBadge__unlimited}>Ilimitada</span>;
    const date = new Date(expiresAt);
    const now = new Date();
    const isExpired = date < now;
    
    return (
      <span className={isExpired ? styles.expBadge__expired : styles.expBadge__temporal}>
        {isExpired ? 'Expiró' : 'Expira'}: {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
      </span>
    );
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.header__content}>
          <h1 className={styles.header__title}>KSM License Manager</h1>
          <button className={styles.btn__secondary} onClick={fetchLicenses}>
            🔄 Recargar Lista
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.card__header}>
            <h2 className={styles.card__title}>Control de Licencias</h2>
            <p className={styles.card__subtitle}>Gestiona el acceso de tus clientes en tiempo real.</p>
          </div>
          
          {loading ? (
            <div className={styles.loading}>Sincronizando con Supabase...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>App</th>
                    <th>HWID</th>
                    <th>Estado</th>
                    <th>Expiración</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.table__empty}>Esperando primera solicitud de cliente...</td>
                    </tr>
                  ) : (
                    licenses.map(license => (
                      <tr key={license.id} className={!license.is_active ? styles.row__dimmed : ''}>
                        <td className={styles.clientName}>{license.client_name}</td>
                        <td><span className={styles.badge}>{license.app_name}</span></td>
                        <td className={styles.hwid}>{license.hwid}</td>
                        <td>
                          <span className={`${styles.status} ${license.is_active ? styles['status--active'] : styles['status--inactive']}`}>
                            {license.is_active ? 'Autorizado' : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          {getExpirationStatus(license.expires_at)}
                        </td>
                        <td>
                          <div className={styles.actionsGroup}>
                            {license.is_active ? (
                              <button title="Bloquear" className={styles.btn__danger} onClick={() => revokeLicense(license.id)}>
                                🚫
                              </button>
                            ) : (
                              <button title="Autorizar" className={styles.btn__success} onClick={() => handleAuthorizeClick(license)}>
                                ✅ Autorizar
                              </button>
                            )}
                            <button title="Eliminar" className={styles.btn__delete} onClick={() => deleteLicense(license.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Authorization Modal */}
      {authModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modal__header}>
              <h3>Autorizar Acceso</h3>
              <button className={styles.modal__close} onClick={() => setAuthModal({ isOpen: false, licenseId: null, clientName: '' })}>×</button>
            </div>
            <form className={styles.form} onSubmit={confirmAuthorization}>
              <p className={styles.modal__desc}>
                Configura la licencia para: <strong>{authModal.clientName}</strong>
              </p>
              
              <div className={styles.radioGroup}>
                <label className={`${styles.radioCard} ${authType === 'unlimited' ? styles.radioCard__active : ''}`}>
                  <input type="radio" name="authType" value="unlimited" checked={authType === 'unlimited'} onChange={() => setAuthType('unlimited')} />
                  <div className={styles.radioCard__content}>
                    <h4>Ilimitada</h4>
                    <p>Acceso de por vida sin restricciones.</p>
                  </div>
                </label>

                <label className={`${styles.radioCard} ${authType === 'temporal' ? styles.radioCard__active : ''}`}>
                  <input type="radio" name="authType" value="temporal" checked={authType === 'temporal'} onChange={() => setAuthType('temporal')} />
                  <div className={styles.radioCard__content}>
                    <h4>Temporal</h4>
                    <p>Acceso limitado hasta una fecha fija.</p>
                  </div>
                </label>
              </div>

              {authType === 'temporal' && (
                <div className={styles.form__group}>
                  <label>Fecha de Expiración</label>
                  <input type="date" required value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
              )}

              <div className={styles.modal__actions}>
                <button type="button" className={styles.btn__secondary} onClick={() => setAuthModal({ isOpen: false, licenseId: null, clientName: '' })}>Cancelar</button>
                <button type="submit" className={styles.btn__primary}>Activar Licencia</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
