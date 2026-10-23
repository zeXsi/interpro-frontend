import './styles.css';
import User from '../User';
import Button from 'shared/components/Button';
import Text from 'shared/components/Text'


interface UserInfoProps {
  userName: string;
  userStatus: string;
  docDescription: string;
  docName: string;
  docLink?: string | null;
  docFileName?: string;
  plainText?: boolean;
  documentVariant?: 'ghostLink' | 'link';
}



export default function UserInfo(props: UserInfoProps) {
  const normalizedDocLink = typeof props.docLink === 'string' ? props.docLink : '';
  const fileParts = normalizedDocLink.split('?')[0].split('#')[0].split('.');
  const lastPart = fileParts.pop() ?? ''; // защита от undefined
  const ext = lastPart.trim().toLowerCase();
  const fileExtension: string | false = ext ? `.${ext}` : false;

  return (
    <div className="UserInfo">
      {/* <User name={props.userName} description={props.userStatus} /> */}
      <div className="UserInfo_container">
        {props.plainText ? (
          <p className="UserInfo_description">{props.docDescription}</p>
        ) : (
          <Text className="UserInfo_description">{props.docDescription}</Text>
        )}
        {normalizedDocLink && fileExtension ? (
          <div className="UserInfo_footer">
            <span>Благодарственное письмо:</span>
            <a href={normalizedDocLink} rel="noopener noreferrer nofollow" target="_blank">
              <Button as="span" variant={props.documentVariant ?? 'ghostLink'}>{props.docFileName || `${props.docName}${fileExtension}`}</Button>
            </a>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
