import './styles.css';
import User from '../User';
import Button from 'shared/components/Button';
import Text from 'shared/components/Text'


interface UserInfoProps {
  userName: string;
  userStatus: string;
  docDescription: string;
  docName: string;
  docLink: string;
}



export default function UserInfo(props: UserInfoProps) {
  const fileParts = props.docLink.split('?')[0].split('#')[0].split('.');
  const lastPart = fileParts.pop() ?? ''; // защита от undefined
  const ext = lastPart.trim().toLowerCase();
  const fileExtension: string | false = ext ? `.${ext}` : false;

  return (
    <div className="UserInfo">
      {/* <User name={props.userName} description={props.userStatus} /> */}
      <div className="UserInfo_container">
        <Text className='UserInfo_description'>
          { props.docDescription }
        </Text>
        {props?.docLink && fileExtension ? (
          <div className="UserInfo_footer">
            <span>Благодарственное письмо:</span>
            <a href={props?.docLink} rel="noopener noreferrer nofollow" target="_blank">
              <Button variant="ghostLink">{`${props.docName}${fileExtension}`}</Button>
            </a>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
