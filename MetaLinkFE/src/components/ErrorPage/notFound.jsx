import './NotFound.css';

const NotFound = () => {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className='error-all'>
      <div className="nf-container">
        <div className="nf-content">
          <div className="nf-robot">
            <div className="nf-head">
              <div className="nf-eyes">
                <div className="nf-eye"></div>
                <div className="nf-eye"></div>
              </div>
              <div className="nf-mouth"></div>
            </div>
            <div className="nf-body">
              <div className="nf-button"></div>
            </div>
          </div>

          <div className="nf-text-content">
            <h1 className="nf-title">404</h1>
            <p className="nf-text">Page Couldn't Found</p>
          </div>

          <button className="nf-back-button" onClick={goBack}>
            Turn Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;