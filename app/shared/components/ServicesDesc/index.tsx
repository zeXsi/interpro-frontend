import './styles.css';
import InfoList from 'shared/components/InfoList';

interface Props {
  title: string,
  children: string,
}
export default function ServicesDesc({ title, children }: Props) {
  return (<InfoList
    variant={ 'paragraph' }
    className="ServicesDesc"
    title={ `( ${title} )` }
    items={ [[children]] }
  />)
}