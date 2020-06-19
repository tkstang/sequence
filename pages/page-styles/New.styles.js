import styled from 'styled-components';

const NewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  label {
    display: flex;
    flex-direction: column;

    input {
      margin-top: 20px;
      height: 30px;
    }
  }
`;

export { NewContainer, FormContainer };
