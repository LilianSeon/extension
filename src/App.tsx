import { useEffect } from 'react';
import './background';
//import ChartExtension from './js/chartExtension';

const App = () => {

  useEffect(() => {
    //new ChartExtension(document.getElementById('chartContainer')!);
  }, []);


  return (
    <>
      <div id="chartContainer"></div>
    </>
  )
};

export default App
