import React from 'react'
import {SignIn} from "@clerk/nextjs";
const SignInPage = () => {
  return (
    <main className='flex w-full items-center justify-center h-screen'>
        <SignIn/>
    </main>
  )
}

export default SignInPage