import {useNavigate} from "react-router-dom";
import Button from "./Button";
import {CiUser} from "react-icons/ci";
import {HiArrowRightOnRectangle} from "react-icons/hi2";
import {getCurrentUser, logout} from "../services/authApi";

function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login", {replace: true});
  }

  return (
    <header className=" py-[1.2rem] px-[4.8rem] border-b border-border">
      <div className="text-text-primary text-sm w-full justify-end flex items-center gap-4">
        <div className="w-7 h-7 bg-black/20 rounded-full"></div>
        <div>
          {user?.fullName || user?.email}
          <span className="ml-2 rounded-full bg-bg px-2 py-1 text-xs capitalize text-text-secondary">
            {user?.role}
          </span>
        </div>
        <Button variation="secondary">
          <CiUser className="text-lg" />
        </Button>
        <Button variation="secondary" onClick={handleLogout}>
          <HiArrowRightOnRectangle className="text-lg" />
        </Button>
      </div>
    </header>
  );
}

export default Header;
