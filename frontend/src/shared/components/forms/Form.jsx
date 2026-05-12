import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Reusable Form component that integrates React Hook Form and Zod validation,
 * with standard loading and submission handling.
 */
export const Form = ({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = '',
}) => {
  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={className}>
        {/* Pass isSubmitting state to children if they are a function, otherwise render normally */}
        {typeof children === 'function' ? children({ isSubmitting }) : children}
      </form>
    </FormProvider>
  );
};

export default Form;
