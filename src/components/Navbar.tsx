import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ShopDetailsForm from "@/components/ShopDetailsForm";
import { useAppContext } from "@/context/AppContext";
import { showSuccess } from "@/utils/toast";
import { ShopDetails } from "@/types";

const Navbar: React.FC = () => {
  const { shopDetails, updateShopDetails } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveShopDetails = (data: ShopDetails) => {
    updateShopDetails(data);
    showSuccess("Shop details updated successfully!");
    setIsSettingsOpen(false);
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          POS System
        </Link>
        <div className="space-x-4 flex items-center">
          <Button variant="ghost" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> POS
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Shop Settings</DialogTitle>
              </DialogHeader>
              <ShopDetailsForm
                initialData={shopDetails}
                onSubmit={handleSaveShopDetails}
                onCancel={() => setIsSettingsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;