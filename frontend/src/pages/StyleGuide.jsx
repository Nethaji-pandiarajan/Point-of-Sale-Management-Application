import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { Info, HelpCircle, Save, Mail, Trash, Plus } from 'lucide-react';

const StyleGuide = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('');

  const triggerToast = (type, msg) => {
    addToast(msg || `This is a ${type} notification message!`, type);
  };

  const triggerConfirm = async () => {
    const isConfirmed = await confirm({
      title: 'Delete this category?',
      message: 'Are you sure you want to delete this category? This will delete all products grouped inside it.',
      confirmLabel: 'Delete Category',
      cancelLabel: 'Keep Category',
      variant: 'danger'
    });

    if (isConfirmed) {
      addToast('Category was successfully deleted', 'success');
    } else {
      addToast('Deletion cancelled', 'info');
    }
  };

  const handleValidateInput = () => {
    if (!inputText) {
      setInputError('This field cannot be empty. Please type something!');
    } else {
      setInputError('');
      addToast(`Validation passed: "${inputText}"`, 'success');
    }
  };

  const mockOptions = [
    { value: 'dine-in', label: 'Dine In' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '40px' }}>
      
      {/* Brand Identity / Color Palettes */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          1. Brand Palette & Typography
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Primary', hex: '#C1694F', varName: '--color-primary' },
            { name: 'Primary Dark', hex: '#A6543D', varName: '--color-primary-dark' },
            { name: 'Secondary', hex: '#7C9473', varName: '--color-secondary' },
            { name: 'Background', hex: '#FBF7F2', varName: '--color-background' },
            { name: 'Surface', hex: '#FFFEFB', varName: '--color-surface' },
            { name: 'Text Primary', hex: '#3B322C', varName: '--color-text-primary' },
            { name: 'Text Secondary', hex: '#7A6F65', varName: '--color-text-secondary' },
            { name: 'Border', hex: '#E8DFD5', varName: '--color-border' }
          ].map((color, idx) => (
            <div key={idx} style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                backgroundColor: `var(${color.varName})`,
                height: '50px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '8px',
                border: color.name === 'Surface' ? '1px solid var(--color-border)' : 'none'
              }}></div>
              <p style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{color.name}</p>
              <code style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{color.hex}</code>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '8px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '4px 0' }}>
            Headings: Fraunces Font Sample
          </h4>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>
            Body Text: Inter font sample. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </section>

      {/* Button Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          2. Reusable Buttons
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="ghost">Ghost Option</Button>
          <Button variant="danger" icon={Trash}>Danger Button</Button>
          <Button variant="primary" icon={Plus}>With Icon</Button>
          <Button variant="primary" isLoading>Loading State</Button>
          <Button variant="primary" disabled>Disabled State</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginRight: '8px' }}>Sizes:</span>
          <Button variant="secondary" size="sm">Small (sm)</Button>
          <Button variant="secondary" size="md">Medium (md)</Button>
          <Button variant="secondary" size="lg">Large (lg)</Button>
        </div>
      </section>

      {/* Badges Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          3. Status Badges
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      {/* Forms and Inputs */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          4. Form Inputs & Selects
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Card>
            <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Text Input"
                placeholder="Type here..."
                helperText="Standard clean helper text explanation."
              />
              <Input
                label="With Left Icon"
                icon={Mail}
                placeholder="email@example.com"
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <Input
                  label="Inline Validation Input"
                  placeholder="Leave empty to test error..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  error={inputError}
                  style={{ flexGrow: 1 }}
                />
                <Button variant="secondary" onClick={handleValidateInput} style={{ marginBottom: inputError ? '24px' : '0px' }}>
                  Verify
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Select Fields</CardTitle></CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Select
                label="Order Fulfilment Type"
                options={mockOptions}
                placeholder="Choose options"
              />
              <Select
                label="Disabled Selection Dropdown"
                options={mockOptions}
                disabled
              />
              <Select
                label="Validation Error State"
                options={mockOptions}
                error="Please pick a delivery channel"
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Toast Notification Stack triggers */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          5. Toast Notifications & Confirmation Dialogs
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <Card>
            <CardHeader>
              <CardTitle>Toast Notification Triggers</CardTitle>
              <CardDescription>Click to stack status alert notifications at the corner</CardDescription>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Button variant="secondary" onClick={() => triggerToast('success', 'Product saved successfully!')}>
                Success Toast
              </Button>
              <Button variant="secondary" onClick={() => triggerToast('error', 'Authentication connection failed.')}>
                Error Toast
              </Button>
              <Button variant="secondary" onClick={() => triggerToast('warning', 'Low stock warning for "Truffle Pasta"')}>
                Warning Toast
              </Button>
              <Button variant="secondary" onClick={() => triggerToast('info', 'Customer order state set to "Preparing"')}>
                Info Toast
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global ConfirmDialog Trigger</CardTitle>
              <CardDescription>Fires a promise-based alert prompt inside the dashboard layout</CardDescription>
            </CardHeader>
            <CardBody>
              <Button variant="danger" icon={HelpCircle} onClick={triggerConfirm}>
                Open Delete Confirmation
              </Button>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Interactive Modal section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          6. Interactive Modals
        </h3>
        <Card>
          <CardHeader>
            <CardTitle>Modal Shell Sandbox</CardTitle>
            <CardDescription>Click below to pop open our modal shell dialog overlay</CardDescription>
          </CardHeader>
          <CardBody>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Custom Modal
            </Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Add Menu Product"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" icon={Save} onClick={() => {
                    setIsModalOpen(false);
                    addToast('Product successfully added!', 'success');
                  }}>Save Product</Button>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Complete the item details to add a new dish to the live customer catalog.
                </p>
                <Input label="Product Name" placeholder="e.g. Lobster Fettuccine" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="Price ($)" type="number" placeholder="24.99" required />
                  <Select label="Category" options={[
                    { value: 'pastas', label: 'Pastas' },
                    { value: 'seafood', label: 'Seafood' },
                    { value: 'desserts', label: 'Desserts' }
                  ]} />
                </div>
              </div>
            </Modal>
          </CardBody>
        </Card>
      </section>

      {/* Table shells & Empty States */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          7. Tables & Empty States
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <Card>
            <CardHeader><CardTitle>Reusable Table Shell</CardTitle></CardHeader>
            <CardBody style={{ padding: '0 20px 20px 20px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Food Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ fontWeight: '600' }}>Focaccia Bread</TableCell>
                    <TableCell>$8.50</TableCell>
                    <TableCell><Badge variant="success">Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ fontWeight: '600' }}>Tiramisu Cup</TableCell>
                    <TableCell>$12.00</TableCell>
                    <TableCell><Badge variant="warning">Low Stock</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ fontWeight: '600' }}>Blackberry Mocktail</TableCell>
                    <TableCell>$7.50</TableCell>
                    <TableCell><Badge variant="error">Disabled</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inline EmptyState Component Demonstration</CardTitle></CardHeader>
            <CardBody>
              <EmptyState
                title="Search term did not match any categories"
                description="We couldn't find matches for 'Gluten-Free'. Try adjusting spelling or searching another category."
                icon={Info}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Loaders & Spinners */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          8. Loaders & Spinners
        </h3>
        <Card>
          <CardBody style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Spinner size="xs" />
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Sizes: xs, sm, md, lg, xl</span>
          </CardBody>
        </Card>
      </section>

    </div>
  );
};

export default StyleGuide;
