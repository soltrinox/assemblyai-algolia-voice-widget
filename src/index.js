import 'babel-polyfill';
import AssemblyAI from './lib/assemblyai';

import './scss/main.scss';

export const assemblyAIHelper = (token, params) => ({
  // language,
  searchAsYouSpeak,
  onQueryChange,
  onStateChange
}) => {
  if (searchAsYouSpeak) {
    console.warn(
      "the assemblyAI voice helper doesn't support searchAsYouSpeak"
    );
  }

  const getDefaultState = status => ({
    status,
    transcript: '',
    isSpeechFinal: false,
    errorCode: undefined
  });
  let state = getDefaultState('initial');
  const assembly = new AssemblyAI(token, params);

  // TODO: can be done?
  // if (language) {
  //   assembly.lang = language;
  // }

  assembly.on('start', () => {
    setState({
      status: 'recognizing'
    });
  });

  assembly.on('error', event => {
    setState({
      status: 'error',
      errorCode: event.error || 'Something went wrong'
    });
  });

  assembly.on('stop', () => {
    setState({
      status: 'finished'
    });
  });

  assembly.on('complete', ({ text } = {}) => {
    setState({
      transcript: text
    });
    onQueryChange(text);
  });

  const isBrowserSupported = () =>
    Boolean(window.AudioContext || window.webkitAudioContext) &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const isListening = () =>
    state.status === 'askingPermission' || state.status === 'recognizing';

  const setState = (newState = {}) => {
    state = { ...state, ...newState };

    if (document.querySelector('.AssemblyAIHelper')) {
      if (isListening()) {
        document
          .querySelector('.AssemblyAIHelper')
          .classList.add('AssemblyAIHelper--listening');
      } else {
        document
          .querySelector('.AssemblyAIHelper')
          .classList.remove('AssemblyAIHelper--listening');
      }
    }

    onStateChange();
  };

  const resetState = (status = 'initial') => {
    setState(getDefaultState(status));
  };

  const getState = () => state;

  const startListening = () => {
    if (!assembly) {
      return;
    }

    resetState('askingPermission');

    assembly.start();
  };

  const dispose = () => {
    if (!assembly) {
      return;
    }
    assembly.stop();

    assembly = undefined;
  };

  const stopListening = () => {
    assembly.stop();
    // Because `dispose` removes event listeners, `end` listener is not called.
    // So we're setting the `status` as `finished` here.
    // If we don't do it, it will be still `waiting` or `recognizing`.
    resetState('finished');
  };

  return {
    getState,
    isBrowserSupported,
    isListening,
    startListening,
    stopListening,
    dispose
  };
};
