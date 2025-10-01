import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Verificar conexión con Firebase
async function checkFirebaseConnection() {
  try {
    console.log('Verificando conexión con Firebase...');
    const testCollection = collection(db, 'test');
    console.log('Conexión con Firebase establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error de conexión con Firebase:', error);
    return false;
  }
}

const form = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const imgbbApiKey = '79e84f5290bd6350810659c71efe7f34';

// Mostrar indicador de carga
function showLoading(message = 'Cargando...') {
  productList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">${message}</td></tr>`;
}

// Validar clave de API de ImgBB
async function validateImgBBApiKey() {
  try {
    console.log('Validando clave de API de ImgBB...');
    
    // Crear una imagen de prueba pequeña (1x1 pixel transparente)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1, 1);
    
    const testImageData = canvas.toDataURL('image/png').split(',')[1];
    
    const formData = new FormData();
    formData.append('key', imgbbApiKey);
    formData.append('image', testImageData);
    
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    
    if (data.success) {
      console.log('✅ Clave de API de ImgBB válida');
      return true;
    } else {
      console.error('❌ Clave de API de ImgBB inválida:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error al validar clave de API:', error);
    return false;
  }
}

// Subir imagen a ImgBB y obtener la URL
async function uploadImageToImgBB(file) {
  try {
    console.log('Iniciando subida de imagen:', file.name, file.size, 'bytes');
    
    // Verificar tamaño del archivo (máximo 32MB para ImgBB)
    if (file.size > 32 * 1024 * 1024) {
      throw new Error('La imagen es demasiado grande. Máximo 32MB permitido.');
    }
    
    // Validar API key antes de subir
    const isApiKeyValid = await validateImgBBApiKey();
    if (!isApiKeyValid) {
      throw new Error('Clave de API de ImgBB inválida. Verifica tu clave en imgbb.com');
    }
    
    // Método 1: Enviar archivo directamente
    const formData = new FormData();
    formData.append('key', imgbbApiKey);
    formData.append('image', file);
    
    console.log('Enviando petición a ImgBB (método archivo directo)...');
    
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Respuesta de ImgBB:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      
      // Si falla el método directo, intentar con base64
      console.log('Intentando método base64...');
      return await uploadImageToImgBBBase64(file);
    }
    
    const data = await res.json();
    console.log('Respuesta completa de ImgBB:', data);
    
    if (!data.success) {
      throw new Error(`Error de ImgBB: ${data.error?.message || 'Error desconocido'}`);
    }
    
    if (!data.data || !data.data.url) {
      throw new Error('No se pudo obtener la URL de la imagen');
    }
    
    console.log('Imagen subida exitosamente:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('Error al subir imagen a ImgBB:', error);
    alert(`Error al subir la imagen: ${error.message}`);
    return null;
  }
}

// Método alternativo con base64
async function uploadImageToImgBBBase64(file) {
  try {
    console.log('Intentando método base64...');
    
    // Convertir imagen a base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remover el prefijo data:image/...
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.log('Imagen convertida a base64, tamaño:', base64.length);
    
    // Crear FormData con la imagen en base64
    const formData = new FormData();
    formData.append('key', imgbbApiKey);
    formData.append('image', base64);
    
    console.log('Enviando petición a ImgBB (método base64)...');
    
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Respuesta de ImgBB (base64):', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response (base64):', errorText);
      throw new Error(`Error HTTP: ${res.status} - ${res.statusText}. Detalles: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Respuesta completa de ImgBB (base64):', data);
    
    if (!data.success) {
      throw new Error(`Error de ImgBB: ${data.error?.message || 'Error desconocido'}`);
    }
    
    if (!data.data || !data.data.url) {
      throw new Error('No se pudo obtener la URL de la imagen');
    }
    
    console.log('Imagen subida exitosamente (base64):', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('Error al subir imagen a ImgBB (base64):', error);
    throw error;
  }
}

// Guardar producto en Firestore
async function saveProduct(product) {
  try {
    console.log('Guardando producto:', product);
    const docRef = await addDoc(collection(db, 'products'), product);
    console.log('Producto guardado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar producto en Firestore:', error);
    throw new Error('No se pudo guardar el producto en la base de datos');
  }
}

// Mostrar productos en la tabla
async function loadProducts() {
  try {
    console.log('Cargando productos desde Firestore...');
    showLoading('Cargando productos...');
    const querySnapshot = await getDocs(collection(db, 'products'));
    console.log('Productos encontrados:', querySnapshot.size);
    
    if (querySnapshot.empty) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay productos registrados</td>';
      productList.appendChild(row);
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Producto cargado:', data);
      const { name, price, description, imageUrl } = data;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${name}</td>
        <td>$${price}</td>
        <td>${description}</td>
        <td>${imageUrl ? `<img src="${imageUrl}" alt="Imagen" style="max-width:60px;max-height:60px;border-radius:6px;">` : 'Sin imagen'}</td>
      `;
      productList.appendChild(row);
    });
    console.log('Productos mostrados en la tabla');
  } catch (error) {
    console.error('Error al cargar productos:', error);
    productList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #e74c3c;">Error al cargar los productos</td></tr>';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const name = form.name.value;
    const price = form.price.value;
    const description = form.description.value;
    const imageFile = form.image.files[0];
    let imageUrl = '';
    
    if (imageFile) {
      imageUrl = await uploadImageToImgBB(imageFile);
      if (imageUrl === null) {
        // Si hay error al subir la imagen, no continuar
        return;
      }
    }
    
    const product = { name, price, description, imageUrl };
    await saveProduct(product);
    form.reset();
    loadProducts();
    
    // Mostrar mensaje de éxito
    alert('Producto agregado exitosamente');
  } catch (error) {
    console.error('Error al guardar producto:', error);
    alert(`Error al guardar el producto: ${error.message}`);
  }
});

// Inicializar la aplicación
async function initializeApp() {
  console.log('Inicializando aplicación...');
  
  // Verificar conexión con Firebase
  const isConnected = await checkFirebaseConnection();
  if (!isConnected) {
    alert('Error: No se pudo conectar con Firebase. Verifica tu configuración.');
    return;
  }
  
  // Cargar productos existentes
  await loadProducts();
  console.log('Aplicación inicializada correctamente');
}

// Event listeners para botones de prueba
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  
  // Botón para probar conexión
  document.getElementById('test-connection').addEventListener('click', async () => {
    const isConnected = await checkFirebaseConnection();
    if (isConnected) {
      alert('✅ Conexión con Firebase exitosa');
    } else {
      alert('❌ Error de conexión con Firebase');
    }
  });
  
  // Botón para actualizar productos
  document.getElementById('refresh-products').addEventListener('click', async () => {
    await loadProducts();
  });
  
  // Botón para validar API key de ImgBB
  document.getElementById('test-api-key').addEventListener('click', async () => {
    const isValid = await validateImgBBApiKey();
    if (isValid) {
      alert('✅ Clave de API de ImgBB válida');
    } else {
      alert('❌ Clave de API de ImgBB inválida. Verifica tu clave en imgbb.com');
    }
  });
  
  // Botón para probar subida de imagen
  document.getElementById('test-image-upload').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Probando subida de imagen:', file.name);
        const result = await uploadImageToImgBB(file);
        if (result) {
          alert(`✅ Imagen subida exitosamente!\nURL: ${result}`);
        } else {
          alert('❌ Error al subir la imagen');
        }
      }
    };
    input.click();
  });
});
