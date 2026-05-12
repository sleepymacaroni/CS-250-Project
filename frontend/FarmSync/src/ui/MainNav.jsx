import {HiOutlineHome, HiOutlineShoppingBag, HiOutlineClipboardDocumentList} from "react-icons/hi2";
import NavItem from "./NavItem";
import {RiLeafLine} from "react-icons/ri";

function MainNav() {
  return (
    <nav>
      <ul className="flex flex-col gap-4">
        <NavItem to="/dashboard" icon={<HiOutlineHome />}>
          Dashboard
        </NavItem>
        <NavItem to="/marketplace" icon={<HiOutlineShoppingBag />}>
          Marketplace
        </NavItem>
        <NavItem to="/crops" icon={<RiLeafLine />}>
          Crops
        </NavItem>
        <NavItem to="/orders" icon={<HiOutlineClipboardDocumentList />}>
          My Orders
        </NavItem>
      </ul>
    </nav>
  );
}

export default MainNav;
