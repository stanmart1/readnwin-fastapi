import { useParams, useNavigate } from 'react-router-dom';
import EpubReader from '../components/EpubReader';

export default function Reading() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard/library');
  };

  return <EpubReader bookId={bookId} onClose={handleClose} />;
}
