import { useParams, useNavigate } from 'react-router-dom';
import EReader from '../components/EReader';

export default function Reading() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard/library');
  };

  return <EReader bookId={bookId} onClose={handleClose} />;
}
