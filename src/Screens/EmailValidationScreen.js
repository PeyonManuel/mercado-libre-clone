import React, { useEffect, useState } from 'react';
import emailjs from 'emailjs-com';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  updateUserFavorites,
} from '../Actions/userActions';
import { generateRandomNumber } from '../Utils/Utilities';
import bcrypt from 'bcryptjs';
import MessageBox from '../Components/MessageBox';
import LoadingCircle from '../Components/LoadingCircle';
// import axios from 'axios';

const EmailValidationScreen = (props) => {
  const dispatch = useDispatch();
  const checkedEmail = localStorage.getItem('verifyEmail')
    ? JSON.parse(localStorage.getItem('verifyEmail'))
    : null;
  const userLogin = useSelector((state) => state.userLogin);
  const { user, error, loading: loadingLogin } = userLogin;
  const userRegister = useSelector((state) => state.userRegister);
  const { error: errorRegistering, loading: loadingRegister } = userRegister;
  const [localError, setLocalError] = useState('');
  const [input, setInput] = useState(['', '', '', '', '', '']);
  const [hashCode, setHashCode] = useState(
    localStorage.getItem('hashCode')
      ? JSON.parse(localStorage.getItem('hashCode'))
      : null
  );
  const [authType, setAuthType] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    (error || errorRegistering) &&
      setLocalError('Ha ocurrido un error con el registro');
  }, [error, errorRegistering]);

  useEffect(() => {
    checkedEmail === null && setLocalError('Ha ocurrido un error');
  }, [checkedEmail]);

  useEffect(() => {
    const urlParams = new URLSearchParams(props.location.search);
    setAuthType(urlParams.get('authType'));
  }, [props]);
  useEffect(() => {
    const loginTypeSwitch = () => {
      const urlParams = new URLSearchParams(props.location.search);
      switch (urlParams.get('loginType')) {
        case 'favorito':
          dispatch(
            updateUserFavorites({
              _id: props.location.search.split('item_id=')[1],
              noDelete: true,
            })
          );
          window.location.href = './';
          break;
        case 'vender':
          window.location.href = '/vender';
          break;
        case 'new-address':
          window.location.href = '/nueva-direccion';
          break;
        case 'product-question':
          const productQuestion = localStorage.getItem('product-question')
            ? JSON.parse(localStorage.getItem('product-question'))
            : null;
          if (productQuestion) {
            window.location.href = '/product/' + productQuestion._id;
          } else {
            window.location.href = '/';
          }
          break;
        default:
          window.location.href = './';
          break;
      }
    };
    if (success) {
      switch (authType) {
        case 'register':
          loginTypeSwitch();
          break;
        case 'changepsw':
          localStorage.setItem(
            'emailCodeValidated',
            JSON.stringify({ validated: true })
          );
          window.location.href = '/cambiar-contrasena';
          break;
        default:
          window.location.href = '/';
          break;
      }
    }
  }, [success, dispatch, props, authType]);

  useEffect(() => {
    if (!hashCode && checkedEmail) {
      const sendEmail = async () => {
        //   try {
        //     const data = await axios.get(
        //       'https://emailvalidation.abstractapi.com/v1/?api_key=' +
        //         process.env.REACT_APP_EMAIL_VALIDATION_API_KEY +
        //         '&email=' +
        //         checkedEmail.email
        //     );
        //     if (
        //       data &&
        //       data.data &&
        //       data.data.deliverability &&
        //       (data.data.deliverability === 'DELIVERABLE' ||
        //         data.data.deliverability === 'UNKNOWN')
        //     ) {
        try {
          await emailjs.send(
            'gmail',
            'template_l9xup0q',
            {
              email: checkedEmail.email,
              subject: 'Te enviamos el código de seguridad',
              title: 'Ingresá a tu cuenta con tu código de seguridad',
              code: randomNumber,
            },
            'user_sr3l7H8k1UCzb3mvTFObR'
          );
        } catch (error) {
          setLocalError('Parece que tu e-mail no esta disponible');
        }
        //   } else {
        //     setLocalError('Parece que tu e-mail no esta disponible');
        //   }
        // } catch (error) {
        //   console.log(error);
        //   setLocalError('Ha ocurrido un error2');
        // }
      };
      const randomNumber = generateRandomNumber(6);
      const cacheHashCode = bcrypt.hashSync(randomNumber);
      setHashCode(cacheHashCode);
      localStorage.setItem('hashCode', JSON.stringify(cacheHashCode));
      sendEmail();
    }
  }, [checkedEmail, hashCode]);

  useEffect(() => {
    user && authType && authType !== 'changepsw' && setSuccess(true);
  }, [user, authType]);

  const createOtpInputs = (error) => {
    const ammount = 6;
    const div = [];
    for (let i = 0; i < ammount; i++) {
      div.push(
        <input
          key={i}
          id={'input' + i}
          className={
            'otp-input' +
            (i === ammount - 1 ? ' no-space' : i === 2 ? ' big-space' : '') +
            (error ? ' error' : '')
          }
          type='number'
          value={input[i]}
          onPaste={(e) => {
            const filteredPasteValue = e.clipboardData
              .getData('Text')
              .replace(/\D/g, '');
            e.preventDefault();
            if (
              filteredPasteValue.length <= ammount - i &&
              filteredPasteValue.length > 1
            ) {
              filteredPasteValue
                .split('')
                .map((value, j) =>
                  setInput([
                    ...input.slice(i, i + j),
                    value,
                    ...input.slice(i + j + 1),
                  ])
                );
              setInput([
                ...input.slice(0, i),
                ...filteredPasteValue.split(''),
                ...input.slice(filteredPasteValue.length + i),
              ]);
            }
          }}
          onChange={(e) => {
            setCodeError(false);
            if (e.target.value.length <= 1) {
              setInput([
                ...input.slice(0, i),
                e.target.value,
                ...input.slice(i + 1),
              ]);
            }
            if (e.target.value.length === 1) {
              if (document.getElementById('input' + (i + 1))) {
                document.getElementById('input' + (i + 1)).focus();
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.keyCode === 8 && e.target.value.length === 0) {
              if (document.getElementById('input' + (i - 1))) {
                document.getElementById('input' + (i - 1)).focus();
                setInput([...input.slice(0, i - 1), '', ...input.slice(i)]);
              }
            }
            if (
              e.keyCode !== 17 &&
              e.keyCode !== 86 &&
              e.keyCode !== 8 &&
              e.keyCode !== 67 &&
              /\D/g.test(String.fromCharCode(e.keyCode))
            )
              e.preventDefault();
          }}
        ></input>
      );
    }
    error && div.push(<span className='error'>Codigo incorrecto</span>);
    return div;
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (bcrypt.compareSync(input.join(''), hashCode)) {
      if (authType === 'register') {
        if (checkedEmail.exists) {
          dispatch(
            loginUser({
              _id: checkedEmail._id,
              baseCode: '523bhf72y37n782cDFU1FN7NX',
            })
          );
        } else {
          const user = localStorage.getItem('RegisterCacheValues')
            ? JSON.parse(localStorage.getItem('RegisterCacheValues'))
            : null;
          if (user) {
            dispatch(registerUser(user));
          } else {
            alert(
              'Ha ocurrido un error con los datos de registro, volviendo a la pagina de registro'
            );
            props.history.push('/register');
          }
        }
      } else if (authType === 'changepsw') {
        setSuccess(true);
      }
      localStorage.removeItem('hashCode');
    } else {
      setCodeError(true);
    }
  };
  return (
    <div className='width-100 flex-center'>
      {localError ? (
        <MessageBox variant='danger'>{localError}</MessageBox>
      ) : (
        <div className='width-100 flex-center'>
          <div className='extra-header'></div>
          <div className='screen flex-center email-validation-screen'>
            <form onSubmit={submitHandler} className='screen-card login-screen'>
              <div>
                <h2>Ingresá el código que te enviamos por e-mail</h2>
                {checkedEmail &&
                  (checkedEmail.exist ? (
                    <>
                      <p style={{ fontSize: '1.4rem' }}>
                        Te enviamos un código a tu e-mail para que puedas
                        ingresar a tu cuenta.
                      </p>

                      <div className='email-badge row top'>
                        <i className='fa fa-user'></i>
                        <p className='email-badge__user-name'>
                          {checkedEmail.email}
                        </p>
                        <input type='hidden' name='email'>
                          {checkedEmail.email}
                        </input>
                        <a
                          href='/login'
                          onClick={() =>
                            localStorage.removeItem('userCheckNameInfo')
                          }
                        >
                          <i
                            className='fa fa-times'
                            style={{ color: 'black' }}
                          ></i>
                        </a>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '1.4rem' }}>
                      {'Lo enviamos a '}
                      <b>{checkedEmail.email}</b>
                      {
                        ' para confirmar que te pertenece. Si no lo encontrás revisá tu carpeta de correo no deseado.'
                      }
                    </p>
                  ))}
              </div>
              {checkedEmail && (
                <div className='otp-inputs'>{createOtpInputs(codeError)}</div>
              )}
              <button
                type='submit'
                className={
                  'primary block' +
                  (loadingLogin || loadingRegister ? ' loading-padding' : '')
                }
                disabled={loadingLogin || loadingRegister}
              >
                {loadingLogin || loadingRegister ? (
                  <LoadingCircle color='white' />
                ) : checkedEmail.exists ? (
                  'Verificar el código'
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailValidationScreen;
